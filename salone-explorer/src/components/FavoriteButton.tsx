// Favorite toggle for an attraction (SPEC §9.3, §9.5). Thin wrapper over the
// shared SaveButton with kind='favorite' and the favorite.* content keys.
import { Heart } from 'lucide-react';
import { SaveButton } from './SaveButton';

export function FavoriteButton({ attractionId }: { attractionId: string }) {
  return (
    <SaveButton
      attractionId={attractionId}
      kind="favorite"
      icon={Heart}
      labels={{
        add: 'favorite.add',
        remove: 'favorite.remove',
        added: 'favorite.added',
        removed: 'favorite.removed',
      }}
    />
  );
}
