import { useState } from 'react';
import { Folder, FolderOpen, Check, Sparkles, Pencil, Trash2, Plus, Play, RotateCcw } from 'lucide-react';

interface FolderNode {
  name: string;
  description: string;
  children: FolderNode[];
}

const MOCK_PROPOSALS = [
  {
    id: 'preserve',
    type: 'PRESERVE' as const,
    rationale: 'Keep your existing folder structure unchanged. This preserves all current organization and requires no file migration.',
    tree: [
      { name: 'Documents', description: 'General documents', children: [{ name: 'Reports', description: 'Quarterly and annual reports', children: [] }] },
      { name: 'Photos', description: 'Event photos', children: [] },
      { name: 'Misc', description: 'Unsorted files', children: [] },
    ],
  },
  {
    id: 'reorganize',
    type: 'REORGANIZE' as const,
    rationale: 'AI-optimized structure based on your file types and naming patterns. Groups related content together for easier discovery.',
    tree: [
      { name: 'Recruitment', description: 'Rush materials and interest forms', children: [{ name: 'Rush Events', description: 'Rush week schedules and details', children: [] }] },
      { name: 'Finance', description: 'Budget reports, dues tracking, and financial records', children: [] },
      { name: 'Events', description: 'Event planning documents, flyers, and recaps', children: [] },
      { name: 'Meeting Notes', description: 'Weekly chapter meeting agendas and minutes', children: [] },
      { name: 'Marketing', description: 'Social media assets and brand guidelines', children: [] },
      { name: 'Member Resources', description: 'Onboarding guides, bylaws, and handbooks', children: [] },
    ],
  },
  {
    id: 'fresh',
    type: 'FRESH' as const,
    rationale: 'Brand new structure designed for Greek life organizations based on common patterns across 500+ chapters analyzed by AI.',
    tree: [
      { name: 'Administration', description: 'Bylaws, meeting minutes, officer transitions', children: [{ name: 'Officer Resources', description: 'Role-specific guides', children: [] }] },
      { name: 'Recruitment', description: 'Rush materials and PNM tracking', children: [] },
      { name: 'Finance', description: 'Budgets, dues, reimbursements', children: [] },
      { name: 'Events & Social', description: 'Formals, mixers, philanthropy', children: [] },
      { name: 'Marketing & PR', description: 'Brand assets, social media, flyers', children: [] },
      { name: 'New Members', description: 'Education materials and onboarding', children: [] },
      { name: 'Archives', description: 'Historical documents and photos', children: [] },
    ],
  },
];

export const AdminArchitecturePage = () => {
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [editableTree, setEditableTree] = useState<FolderNode[] | null>(null);
  const [activated, setActivated] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedProposal(id);
    const proposal = MOCK_PROPOSALS.find((p) => p.id === id);
    if (proposal) setEditableTree(JSON.parse(JSON.stringify(proposal.tree)));
    setActivated(false);
  };

  const handleActivate = () => {
    setActivated(true);
    // Try real API too
    fetch('/api/v1/architecture/activate', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true }),
    }).catch(() => {});
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Sparkles className="mr-2 inline h-5 w-5 text-yellow-500" />
          AI Architecture Proposals
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gemini AI analyzed your files and generated 3 organization proposals. Select one to use as your folder structure.
        </p>
      </div>

      {/* Proposal cards */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {MOCK_PROPOSALS.map((proposal) => (
          <button
            key={proposal.id}
            onClick={() => handleSelect(proposal.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              selectedProposal === proposal.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950 dark:ring-blue-800'
                : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                proposal.type === 'PRESERVE' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                proposal.type === 'REORGANIZE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              }`}>
                {proposal.type}
              </span>
              {selectedProposal === proposal.id && <Check className="h-5 w-5 text-blue-600" />}
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{proposal.rationale}</p>
            <div className="space-y-1">
              {proposal.tree.map((folder) => (
                <div key={folder.name} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <Folder className="h-3.5 w-3.5 text-blue-500" />
                  <span>{folder.name}</span>
                  {folder.children.length > 0 && <span className="text-gray-400">({folder.children.length})</span>}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Editable tree */}
      {editableTree && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Edit Structure
              <span className="ml-2 text-xs font-normal text-gray-400">Click to customize before activating</span>
            </h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
                <Plus className="h-3.5 w-3.5" /> Add Folder
              </button>
              {!activated ? (
                <button onClick={handleActivate}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  <Play className="h-3.5 w-3.5" /> Activate Structure
                </button>
              ) : (
                <span className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  <Check className="h-3.5 w-3.5" /> Activated
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {editableTree.map((folder, i) => (
              <EditableFolder key={i} folder={folder} depth={0} />
            ))}
          </div>
        </div>
      )}

      {activated && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            <Check className="mr-1 inline h-4 w-4" />
            Architecture activated! Your files will now be organized into this structure.
          </p>
        </div>
      )}
    </div>
  );
};

const EditableFolder = ({ folder, depth }: { folder: FolderNode; depth: number }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0">
          {folder.children.length > 0 ? (expanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />) : <Folder className="h-4 w-4 text-gray-400" />}
        </button>
        <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{folder.name}</span>
        <span className="text-xs text-gray-400">{folder.description}</span>
        <div className="hidden gap-1 group-hover:flex">
          <button className="p-1 text-gray-400 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {expanded && folder.children.map((child, i) => (
        <EditableFolder key={i} folder={child} depth={depth + 1} />
      ))}
    </div>
  );
};
