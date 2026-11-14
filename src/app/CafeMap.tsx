import { ROOMS, type RoomId } from '../game/rooms/cafe';
import type { UiText } from '../i18n';

type Props = {
  open: readonly RoomId[];
  /** Where the player is standing. */
  here: RoomId;
  /** Where the next task is (null when there is none). */
  task: RoomId | null;
  t: UiText;
};

/**
 * The café map in the Journal (GAME_DESIGN.md §3, instead of an on-screen minimap):
 * the rooms in a row, which are locked, where the player is and where the next task is.
 */
export function CafeMap({ open, here, task, t }: Props) {
  return (
    <div className="cafe-map" role="list" aria-label={t.cafeMap}>
      {ROOMS.map((room) => {
        const locked = !open.includes(room.id);
        const classes = ['cafe-map-room', locked && 'locked', room.id === here && 'here'].filter(Boolean).join(' ');
        return (
          <div key={room.id} role="listitem" className={classes} style={{ flex: `${room.right - room.left} 1 0` }}>
            <span className="cafe-map-name">
              {locked ? '🔒 ' : ''}
              {t.rooms[room.id]}
            </span>
            {locked && <span className="cafe-map-note">{t.opensInChapter(room.opensAtChapter)}</span>}
            {room.id === here && <span className="cafe-map-note">📍 {t.youAreHere}</span>}
            {room.id === task && !locked && <span className="cafe-map-note task">❗ {t.nextTaskHere}</span>}
          </div>
        );
      })}
    </div>
  );
}
