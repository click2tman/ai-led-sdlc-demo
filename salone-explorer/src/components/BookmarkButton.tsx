// Bookmark toggle for an attraction (SPEC §9.3, §9.5). Thin wrapper over the
// shared SaveButton with kind='bookmark' and the bookmark.* content keys.
import { Bookmark } from 'lucide-react';
import { SaveButton } from './SaveButton';

export function BookmarkButton({ attractionId }: { attractionId: string }) {
  return (
    <SaveButton
      attractionId={attractionId}
      kind="bookmark"
      icon={Bookmark}
      labels={{
        add: 'bookmark.add',
        remove: 'bookmark.remove',
        added: 'bookmark.added',
        removed: 'bookmark.removed',
      }}
    />
  );
}
