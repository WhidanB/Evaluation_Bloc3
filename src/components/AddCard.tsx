import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Id } from '../types';

interface Props {
  columnId: Id;
  createTask: (columnId: Id, content: string) => void;
}

export default function AddCard({ columnId, createTask }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState('');

  // Ne devrait pas être ici
  const AWS_ACCESS_KEY_ID: string = "AKIAVSM7MFWHHLZBMHQJ";
  const AWS_SECRET_ACCESS_KEY: string = "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";
  console.log("AWS_KEYS", AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY);

  const onAdd = () => {
    if (content.trim() !== '') {
      createTask(columnId, content);
      setContent('');
      setEditMode(false);
    }
  };

  if (!editMode) {
    return (
      <button
        className="add-card-btn"
        onClick={() => setEditMode(true)}
      >
        <Plus size={16} /> Add a card
      </button>
    );
  }

  return (
    <div className="add-card-form">
      <input
        autoFocus
        className="add-card-input"
        placeholder="Enter task description..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd();
          if (e.key === 'Escape') {
            setEditMode(false);
            setContent('');
          }
        }}
      />
      <div className="add-card-actions">
        <button className="btn btn-primary" onClick={onAdd}>Add</button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setEditMode(false);
            setContent('');
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
