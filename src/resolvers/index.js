import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

/** Forge 25초 실행 제한 대응 — 카드 표시 상한 */
const MAX_CARDS_PER_COLUMN = 25;
const MAX_TOTAL_ISSUES = 300;

const ISSUE_FIELDS = 'summary,status,assignee,priority,issuetype';

/** route()는 태그드 템플릿이라 경로를 통째로 넘기면 슬래시까지 인코딩됨.
 *  반드시 리터럴 경로 + 값만 보간해야 한다. */
async function readJson(res) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** 사용자가 접근 가능한 보드 목록 (edit 화면용) */
resolver.define('getBoards', async () => {
  try {
    const res = await api
      .asUser()
      .requestJira(route`/rest/agile/1.0/board?maxResults=50`);
    const data = await readJson(res);
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
  const res = await api
    .asUser()
    .requestJira(route`/rest/agile/1.0/board/${boardId}/configuration`);
  const conf = await readJson(res);
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

    const res = await api
      .asUser()
      .requestJira(
        route`/rest/agile/1.0/board/${boardId}/issue?maxResults=${MAX_TOTAL_ISSUES}&fields=${ISSUE_FIELDS}`
      );
    const data = await readJson(res);

    const issues = data.issues || [];
    const total = data.total ?? issues.length;
    const truncated = total > MAX_TOTAL_ISSUES;

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
        statusCategory: it.fields?.status?.statusCategory?.key ?? 'new',
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
      total,
      truncated,
      limits: { maxTotal: MAX_TOTAL_ISSUES, maxPerColumn: MAX_CARDS_PER_COLUMN },
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

export const handler = resolver.getDefinitions();
