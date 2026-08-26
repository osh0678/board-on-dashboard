import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

/** Forge 25초 실행 제한 대응 — 카드 표시 상한 */
const MAX_CARDS_PER_COLUMN = 25;
const MAX_TOTAL_ISSUES = 300;

async function getJson(path) {
  const res = await api.asUser().requestJira(route`${path}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** 사용자가 접근 가능한 보드 목록 (edit 화면용) */
resolver.define('getBoards', async () => {
  try {
    const data = await getJson('/rest/agile/1.0/board?maxResults=50');
    return {
      ok: true,
      boards: (data.values || []).map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        projectKey: b.location?.projectKey ?? null,
      })),
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/** 보드 구성(컬럼 정의) 조회 */
async function getBoardColumns(boardId) {
  const conf = await getJson(`/rest/agile/1.0/board/${boardId}/configuration`);
  const columns = conf.columnConfig?.columns ?? [];
  return columns.map((c) => ({
    name: c.name,
    statusIds: (c.statuses || []).map((s) => String(s.id)),
  }));
}

/** 보드 이슈를 컬럼별로 묶어서 반환 */
resolver.define('getBoardData', async ({ payload }) => {
  const boardId = payload?.boardId;
  if (!boardId) return { ok: false, error: 'boardId is required' };

  try {
    const columns = await getBoardColumns(boardId);

    const fields = 'summary,status,assignee,priority,issuetype';
    const data = await getJson(
      `/rest/agile/1.0/board/${boardId}/issue?maxResults=${MAX_TOTAL_ISSUES}&fields=${fields}`
    );

    const issues = data.issues || [];
    const truncated = (data.total ?? issues.length) > MAX_TOTAL_ISSUES;

    // statusId -> 컬럼 인덱스 매핑
    const statusToCol = new Map();
    columns.forEach((col, i) => col.statusIds.forEach((sid) => statusToCol.set(sid, i)));

    const buckets = columns.map((c) => ({ name: c.name, cards: [], count: 0 }));
    const unmapped = { name: 'Other', cards: [], count: 0 };

    for (const it of issues) {
      const card = {
        key: it.key,
        summary: it.fields?.summary ?? '',
        status: it.fields?.status?.name ?? '',
        assignee: it.fields?.assignee?.displayName ?? null,
        avatar: it.fields?.assignee?.avatarUrls?.['24x24'] ?? null,
        priority: it.fields?.priority?.name ?? null,
        issueType: it.fields?.issuetype?.name ?? null,
      };
      const sid = String(it.fields?.status?.id ?? '');
      const idx = statusToCol.get(sid);
      const target = idx === undefined ? unmapped : buckets[idx];
      target.count += 1;
      if (target.cards.length < MAX_CARDS_PER_COLUMN) target.cards.push(card);
    }

    const result = buckets.filter((b) => b.count > 0);
    if (unmapped.count > 0) result.push(unmapped);

    return {
      ok: true,
      columns: result,
      total: data.total ?? issues.length,
      truncated,
      limits: { maxTotal: MAX_TOTAL_ISSUES, maxPerColumn: MAX_CARDS_PER_COLUMN },
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

export const handler = resolver.getDefinitions();
