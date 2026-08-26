import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Stack, Inline, Box, Heading, Lozenge, Link,
  Spinner, SectionMessage, Badge,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const Card = ({ c }) => (
  <Box padding="space.075" backgroundColor="color.background.neutral.subtle">
    <Stack space="space.025">
      <Inline space="space.050" alignBlock="center">
        <Link href={`/browse/${c.key}`} openNewTab={false}>{c.key}</Link>
        {c.priority ? <Lozenge appearance="default">{c.priority}</Lozenge> : null}
      </Inline>
      <Text size="small">{c.summary}</Text>
      {c.assignee ? <Text size="small" color="color.text.subtlest">{c.assignee}</Text> : null}
    </Stack>
  </Box>
);

const Column = ({ col }) => (
  <Stack space="space.075" grow="fill">
    <Inline space="space.050" alignBlock="center">
      <Heading as="h4">{col.name}</Heading>
      <Badge appearance="default">{col.count}</Badge>
    </Inline>
    {col.cards.map((c) => <Card key={c.key} c={c} />)}
    {col.count > col.cards.length ? (
      <Text size="small" color="color.text.subtlest">
        +{col.count - col.cards.length} more
      </Text>
    ) : null}
  </Stack>
);

const View = () => {
  const [state, setState] = useState({ loading: true });
  const [boardId, setBoardId] = useState(null);

  useEffect(() => {
    view.getContext().then((ctx) => {
      const id = ctx?.extension?.gadgetConfiguration?.boardId ?? null;
      setBoardId(id);
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
      <SectionMessage appearance="information" title="Pick a board">
        <Text>Click the gadget menu and choose Edit to select a board.</Text>
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
            This board has {state.total} issues. Showing the first {state.limits.maxTotal}.
            Narrow the board filter for a complete view.
          </Text>
        </SectionMessage>
      ) : null}
      <Inline space="space.150" alignBlock="start" shouldWrap>
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
