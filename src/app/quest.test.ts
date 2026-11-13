import { describe, expect, it } from 'vitest';
import { emptyProgress, type Progress } from './progress';
import { acceptRequest, questStage, reportDone, resumeNewLevels, solveRequest, startLevel } from './quest';

const ids = ['ch0-1', 'ch0-2'];

describe('quest loop', () => {
  it('starts every level by talking', () => {
    expect(questStage(emptyProgress, 'ch0-1')).toBe('talk');
  });

  it('goes talk → solve → report → next level', () => {
    let p = acceptRequest(emptyProgress, 'ch0-1');
    expect(questStage(p, 'ch0-1')).toBe('solve');

    p = solveRequest(p, 'ch0-1', 2);
    expect(questStage(p, 'ch0-1')).toBe('report');
    expect(p.completed['ch0-1']).toEqual({ hintsUsed: 2, mistakes: 0, stars: 1 });

    p = reportDone(p, ids, 'ch0-1');
    expect(p.currentLevelId).toBe('ch0-2');
    expect(questStage(p, 'ch0-2')).toBe('talk');
  });

  it('ends at "done" after reporting the last level', () => {
    const p = reportDone(solveRequest(acceptRequest(emptyProgress, 'ch0-2'), 'ch0-2', 0), ids, 'ch0-2');
    expect(p.currentLevelId).toBe('ch0-2');
    expect(questStage(p, 'ch0-2')).toBe('done');
  });

  it('replays a finished level from the start, keeping its best hint count', () => {
    let p = solveRequest(acceptRequest(emptyProgress, 'ch0-1'), 'ch0-1', 0);
    p = startLevel(reportDone(p, ids, 'ch0-1'), 'ch0-1');
    expect(questStage(p, 'ch0-1')).toBe('talk');
    p = solveRequest(acceptRequest(p, 'ch0-1'), 'ch0-1', 3);
    expect(p.completed['ch0-1']).toEqual({ hintsUsed: 0, mistakes: 0, stars: 3 });
  });
});

describe('resumeNewLevels', () => {
  const ids = ['a', 'b', 'c'];
  it('moves a finished player on to a level added after their last one', () => {
    const done: Progress = {
      currentLevelId: 'b',
      completed: {},
      coins: 0,
      soWhatRight: [],
      quest: { levelId: 'b', stage: 'done' },
    };
    expect(resumeNewLevels(done, ids).quest).toEqual({ levelId: 'c', stage: 'talk' });
  });

  it('leaves everyone else alone', () => {
    const finished: Progress = { ...emptyProgress, currentLevelId: 'c', quest: { levelId: 'c', stage: 'done' } };
    expect(resumeNewLevels(finished, ids)).toBe(finished);
    const solving: Progress = { ...emptyProgress, currentLevelId: 'b', quest: { levelId: 'b', stage: 'solve' } };
    expect(resumeNewLevels(solving, ids)).toBe(solving);
  });
});
