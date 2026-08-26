import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Stack, Inline, Box, Lozenge, Link, Spinner, SectionMessage, Badge, xcss,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

/** Jira 상태 카테고리 → Lozenge 색상 */
const APPEARANCE = {
  new: 'default',          // To Do
  indeterminate: 'inprogress', // In Progress
  done: 'success',         // Done
};

const columnStyle = xcss({
  minWidth: '180px',
  paddingInline: 'space.050',
});

const cardStyle = xcss({
  backgroundColor: 'elevation.surface.raised',
  borderRadius: 'border.radius',
  boxShadow: 'elevation.shadow.raised',
  padding: 'space.100',
});

const headerStyle = xcss({
  paddingBlock: 'space.050',
  borderBlockEndWidth: 'border.width',
  borderBlockEndStyle: 'solid',
  borderColor: 'color.border',
});

const Card = ({ c }) => (
  <Box xcss={cardStyle}>
    <Stack space="space.050">
      <Text size="small">{c.summary}</Text>
      <Inline space="space.050" alignBlock="center" shouldWrap>
        <Link href={`/browse/${c.key}`}>
          <Text size="small" weight="medium">{c.key}</Text>
        </Link>
        <Lozenge appearance={APPEARANCE[c.statusCategory] ?? 'default'}>
          {c.status}
        </Lozenge>
      </Inline>
      {c.assignee ? (
        <Text size="small" color="color.text.subtlest">{c.assignee}</Text>
      ) : (
        <Text size="small" color="color.text.subtlest">Unassigned</Text>
      )}
    </Stack>
  </Box>
);

const Column = ({ col }) => (
  <Box xcss={columnStyle}>
    <Stack space="space.100">
      <Box xcss={headerStyle}>
        <Inline space="space.075" alignBlock="center">
          <Text weight="bold" size="small">{col.name.toUpperCase()}</Text>
          <Badge appearance="default">{col.count}</Badge>
        </Inline>
      </Box>
      {col.cards.length === 0 ? (
        <Text size="small" color="color.text.subtlest">Empty</Text>
      ) : (
        col.cards.map((c) => <Card key={c.key} c={c} />)
      )}
      {col.count > col.cards.length ? (
        <Text size="small" color="color.text.subtlest">
          +{col.count - col.cards.length} more
        </Text>
      ) : null}
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
            This board has {state.total.toLocaleString()} issues. Showing the first{' '}
            {state.limits.maxTotal.toLocaleString()}. Narrow the board filter to see everything.
          </Text>
        </SectionMessage>
      ) : null}
      <Inline space="space.100" alignBlock="start" shouldWrap>
        {state.columns.map((col) => <Column key={col.name} col={col} />)}
      </Inline>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>
);
