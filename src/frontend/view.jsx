import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Stack, Inline, Box, Lozenge, Link, Spinner, SectionMessage, xcss,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

/** Jira 상태 카테고리 → Lozenge 색상 */
const APPEARANCE = {
  new: 'default',
  indeterminate: 'inprogress',
  done: 'success',
};

/** 우선순위 → 짧은 표기. 좁은 카드에서 이름 전체는 자리를 너무 먹는다. */
const PRIORITY_SHORT = {
  Highest: 'P1', High: 'P2', Medium: 'P3', Low: 'P4', Lowest: 'P5',
};

/* 컬럼 폭을 고정해야 카드가 눌리지 않는다.
   컬럼이 많으면 가로 스크롤로 넘긴다. */
const boardStyle = xcss({
  overflowX: 'auto',
  paddingBottom: 'space.050',
});

const columnStyle = xcss({
  width: '220px',
  minWidth: '220px',
  paddingInline: 'space.050',
});

const headerStyle = xcss({
  paddingBlock: 'space.075',
  borderBlockEndWidth: 'border.width.outline',
  borderBlockEndStyle: 'solid',
  borderColor: 'color.border.accent.gray',
});

const cardStyle = xcss({
  backgroundColor: 'elevation.surface.raised',
  borderRadius: 'border.radius.100',
  boxShadow: 'elevation.shadow.raised',
  padding: 'space.100',
});

const scrollStyle = xcss({
  maxHeight: '440px',
  overflowY: 'auto',
});

const Card = ({ c }) => (
  <Box xcss={cardStyle}>
    <Stack space="space.075">
      <Text size="small">{c.summary}</Text>
      <Inline space="space.050" alignBlock="center" shouldWrap>
        <Link href={`/browse/${c.key}`}>
          <Text size="small" weight="medium">{c.key}</Text>
        </Link>
        {c.priority ? (
          <Text size="small" color="color.text.subtlest">
            {PRIORITY_SHORT[c.priority] ?? c.priority}
          </Text>
        ) : null}
        {c.assignee ? (
          <Text size="small" color="color.text.subtlest">· {c.assignee}</Text>
        ) : null}
      </Inline>
    </Stack>
  </Box>
);

const Column = ({ col }) => (
  <Box xcss={columnStyle}>
    <Stack space="space.100">
      <Box xcss={headerStyle}>
        <Inline space="space.075" alignBlock="center" spread="space-between">
          <Text weight="bold" size="small">{col.name.toUpperCase()}</Text>
          <Text size="small" color="color.text.subtlest">{col.count.toLocaleString()}</Text>
        </Inline>
      </Box>
      <Box xcss={scrollStyle}>
        <Stack space="space.075">
          {col.cards.length === 0 ? (
            <Text size="small" color="color.text.subtlest">No work items</Text>
          ) : (
            col.cards.map((c) => <Card key={c.key} c={c} />)
          )}
          {col.count > col.cards.length ? (
            <Text size="small" color="color.text.subtlest">
              +{(col.count - col.cards.length).toLocaleString()} more
            </Text>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  </Box>
);

const View = () => {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    view.getContext().then((ctx) => {
      const id = ctx?.extension?.gadgetConfiguration?.boardId ?? null;
      if (!id) {
        setState({ loading: false, unconfigured: true });
        return;
      }
      invoke('getBoardData', { boardId: id })
        .then((r) => setState({ loading: false, ...r }))
        .catch((e) => setState({ loading: false, ok: false, error: String(e) }));
    });
  }, []);

  if (state.loading) return <Spinner size="medium" />;

  if (state.unconfigured) {
    return (
      <SectionMessage appearance="information" title="Pick a board to get started">
        <Text>Open the gadget menu and choose Edit, then select a board.</Text>
      </SectionMessage>
    );
  }

  if (!state.ok) {
    return (
      <SectionMessage appearance="error" title="Could not load the board">
        <Text>{state.error}</Text>
      </SectionMessage>
    );
  }

  return (
    <Stack space="space.100">
      {state.truncated ? (
        <SectionMessage appearance="warning" title="Showing a partial board">
          <Text>
            This board has {state.total.toLocaleString()} work items. Showing the first{' '}
            {state.limits.maxTotal.toLocaleString()}. Narrow the board filter to see everything.
          </Text>
        </SectionMessage>
      ) : null}
      <Box xcss={boardStyle}>
        <Inline space="space.050" alignBlock="start">
          {state.columns.map((col) => <Column key={col.name} col={col} />)}
        </Inline>
      </Box>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>
);
