// LOCAL BUILD: this file was modified relative to upstream Kong/insomnia (core@13.3.1) - see README.md
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { Button } from 'react-aria-components';
import { useParams } from 'react-router';
import { useState } from 'react';

import { useProjectLoaderData } from '~/routes/organization.$organizationId.project.$projectId';
import { ErrorBoundary } from '~/ui/components/error-boundary';
import { Icon } from '~/ui/components/icon';
import { NewWorkspaceModal } from '~/ui/components/modals/new-workspace-modal';
import { useOrganizationStorageRule } from '~/ui/hooks/use-organization-storage-rule';

export const scratchPadTutorialList: {
  id: string;
  title: string;
  name: string;
  desc: string;
  learnMoreLink: string;
  icon: IconName | [IconPrefix, IconName];
}[] = [
  {
    id: 'collection',
    title: `API Collections`,
    name: 'collections',
    desc: 'Use API collections to design, test APIs and run automated tests.',
    learnMoreLink: 'https://developer.konghq.com/insomnia/collections/',
    icon: 'bars',
  },
  {
    id: 'mcp',
    title: `MCP Clients`,
    name: 'MCP clients',
    desc: 'Use MCP clients to connect external Model Context Protocol (MCP) Servers to access AI-ready tools, prompts, and resource.',
    learnMoreLink: 'https://developer.konghq.com/insomnia/mcp-clients-in-insomnia/',
    icon: ['fac', 'mcp'] as unknown as [IconPrefix, IconName],
  },
  {
    id: 'mock-server',
    title: `Mocks`,
    name: 'mock servers',
    desc: 'Use mock servers to simulate API endpoints without a live backend.',
    learnMoreLink: 'https://developer.konghq.com/insomnia/mock-servers/',
    icon: 'server',
  },
  {
    id: 'environment',
    title: `Environments`,
    name: 'environments',
    desc: 'Use environments to manage shared values like base URLs, API keys, and tokens across requests.',
    learnMoreLink: 'https://developer.konghq.com/insomnia/environments/',
    icon: 'code',
  },
];

// LOCAL BUILD: the tutorial panels used to gate creation behind "Sign up to create X"
// and linked to /auth/login. With the cloud removed, the buttons open the real
// create dialogs (NewWorkspaceModal) for the matching scope instead.
const tutorialIdToScope: Record<string, 'collection' | 'mcp' | 'mock-server' | 'environment'> = {
  collection: 'collection',
  mcp: 'mcp',
  'mock-server': 'mock-server',
  environment: 'environment',
};

const TutorialContent = ({ panel }: { panel?: string }) => {
  const selectedTutorial = scratchPadTutorialList.find(t => t.id === panel);
  const { organizationId } = useParams() as { organizationId?: string };
  const projectData = useProjectLoaderData();
  const storageRules = useOrganizationStorageRule(organizationId ?? '');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!selectedTutorial) {
    return null;
  }

  const scope = tutorialIdToScope[selectedTutorial.id];
  const canCreate = !!projectData?.activeProject && !!scope;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="mb-4 text-2xl font-bold text-(--color-font)">{selectedTutorial.title}</h1>
        <p className="mb-8 text-(--hl)">{selectedTutorial.desc}</p>

        <div className="mb-8 space-y-4">
          <Button
            onPress={() => canCreate && setIsCreateOpen(true)}
            isDisabled={!canCreate}
            className="rounded-md bg-(--color-surprise) px-6 py-2 text-white transition-colors disabled:opacity-50"
          >
            Create {selectedTutorial.name}
          </Button>
        </div>
      </div>

      <div className="radius-full mt-8 rounded-full border border-solid border-(--hl) px-6 py-2 text-(--hl)">
        <Icon icon="book-open" className="mr-2 h-4 w-4" />
        Learn more about{' '}
        <Button
          onPress={() => window.main.openInBrowser(selectedTutorial.learnMoreLink)}
          className="inline-flex items-center gap-2 text-sm text-(--color-font-secondary) underline transition-colors hover:text-(--color-font)"
        >
          {selectedTutorial.name}
          <Icon icon="external-link" className="h-3 w-3" />
        </Button>
      </div>

      {canCreate && projectData?.activeProject && (
        <NewWorkspaceModal
          // LOCAL BUILD: remount per panel — NewWorkspaceModal initializes its
          // scope/name state in useState, so reusing the instance across panels
          // would keep showing the previously opened dialog type.
          key={selectedTutorial.id}
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          project={projectData.activeProject}
          storageRules={storageRules}
          scope={scope}
        />
      )}
    </div>
  );
};

const Tutorial = () => {
  const { panel } = useParams() as { panel?: string };

  return (
    <ErrorBoundary showAlert>
      <TutorialContent panel={panel} />
    </ErrorBoundary>
  );
};

export default Tutorial;
