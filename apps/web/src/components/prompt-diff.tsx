import { useMemo } from "react";
import { diffWords, type Change } from "diff";

interface PromptDiffProps {
  leftContent: string;
  rightContent: string;
  leftVersion: number;
  rightVersion: number;
}

export function PromptDiff({ leftContent, rightContent, leftVersion, rightVersion }: PromptDiffProps) {
  const diff = useMemo(() => {
    return diffWords(leftContent, rightContent);
  }, [leftContent, rightContent]);

  const renderDiff = (d: Change[]) => {
    return d.map((part, index) => {
      const style = part.added
        ? "bg-green-200 text-green-900"
        : part.removed
        ? "bg-red-200 text-red-900 line-through"
        : "text-gray-900";

      const changeType = part.added ? "added" : part.removed ? "removed" : "unchanged";
      const keyPrefix = `${changeType}-${part.value.length}-${part.value.slice(0, 10).replace(/\s/g, "_")}`;

      return (
        <span key={keyPrefix} className={style}>
          {part.value}
        </span>
      );
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="border-r pr-4">
        <h3 className="font-bold mb-2">Version {leftVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.added))}
        </div>
      </div>
      <div className="pl-4">
        <h3 className="font-bold mb-2">Version {rightVersion}</h3>
        <div className="whitespace-pre-wrap text-sm font-mono">
          {renderDiff(diff.filter((d) => !d.removed))}
        </div>
      </div>
    </div>
  );
}
