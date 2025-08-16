// src/components/DocumentComparison.tsx
import React from 'react';
import type { FC } from 'react';

type Props = {
  version1: { content: string };
  version2: { content: string };
  onBack: () => void;
};

const DocumentComparison: FC<Props> = ({ version1, version2, onBack }) => {
  return (
    <div className="flex gap-4">
      <div className="w-1/2 border p-2">
        <h2>Версия 1</h2>
        <pre className="whitespace-pre-wrap">{version1.content}</pre>
      </div>
      <div className="w-1/2 border p-2">
        <h2>Версия 2</h2>
        <pre className="whitespace-pre-wrap">{version2.content}</pre>
      </div>
      <button onClick={onBack} className="btn btn-secondary">
        Назад
      </button>
    </div>
  );
};

export default DocumentComparison;