import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Stack, Box, Select, Button, Spinner, SectionMessage, Label, Inline,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

/** 설정 화면 — 보드 하나만 고르면 끝. */
const Edit = () => {
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    invoke('getBoards')
      .then((r) => (r.ok ? setBoards(r.boards) : setError(r.error)))
      .catch((e) => setError(String(e)));
    view.getContext().then((ctx) => {
      const id = ctx?.extension?.gadgetConfiguration?.boardId;
      if (id) setSelected(String(id));
    });
  }, []);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    // refresh: 자동 새로고침 주기(분)
    await view.submit({ boardId: Number(selected), refresh: 15 });
  };

  if (error) {
    return (
      <SectionMessage appearance="error" title="Could not load boards">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }
  if (!boards) return <Spinner size="medium" />;

  if (boards.length === 0) {
    return (
      <SectionMessage appearance="information" title="No boards found">
        <Text>Create a Scrum or Kanban board in Jira first, then come back.</Text>
      </SectionMessage>
    );
  }

  const options = boards.map((b) => ({
    label: `${b.name}${b.projectKey ? ` (${b.projectKey})` : ''}`,
    value: String(b.id),
  }));

  return (
    <Stack space="space.150">
      <Box>
        <Label labelFor="board-select">Board</Label>
        <Select
          id="board-select"
          options={options}
          value={options.find((o) => o.value === selected) ?? null}
          onChange={(o) => setSelected(o?.value ?? null)}
          placeholder="Select a board"
          isSearchable
        />
      </Box>
      <Inline space="space.100">
        <Button appearance="primary" onClick={save} isDisabled={!selected || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Inline>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>
);
