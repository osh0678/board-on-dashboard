import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text, Stack, Select, Button, Spinner, SectionMessage, Label, Form, useForm,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

const Edit = () => {
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const { handleSubmit } = useForm();

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

  const options = boards.map((b) => ({
    label: `${b.name}${b.projectKey ? ` (${b.projectKey})` : ''} · ${b.type}`,
    value: String(b.id),
  }));

  return (
    <Form onSubmit={handleSubmit(save)}>
      <Stack space="space.150">
        <Label labelFor="board">Board</Label>
        <Select
          id="board"
          options={options}
          value={options.find((o) => o.value === selected) ?? null}
          onChange={(o) => setSelected(o?.value ?? null)}
          placeholder="Select a board"
        />
        <Button type="submit" appearance="primary" isDisabled={!selected}>Save</Button>
      </Stack>
    </Form>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>
);
