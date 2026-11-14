import { describe, expect, it } from 'vitest';
import { emptyProgress, type Progress } from './progress';
import {
  acceptRequest,
  placeAfterSkillCheck,
  questStage,
  reportDone,
  resumeNewLevels,
  solveRequest,
  startLevel,
} from './quest';
import { isDone, isNewPlayer, parseProgress } from './progress';

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
    const done: Progress = { ...emptyProgress, currentLevelId: 'b', quest: { levelId: 'b', stage: 'done' } };
    expect(resumeNewLevels(done, ids).quest).toEqual({ levelId: 'c', stage: 'talk' });
  });

  it('leaves everyone else alone', () => {
    const finished: Progress = { ...emptyProgress, currentLevelId: 'c', quest: { levelId: 'c', stage: 'done' } };
    expect(resumeNewLevels(finished, ids)).toBe(finished);
    const solving: Progress = { ...emptyProgress, currentLevelId: 'b', quest: { levelId: 'b', stage: 'solve' } };
    expect(resumeNewLevels(solving, ids)).toBe(solving);
  });
});

describe('after the Skill Check', () => {
  it('skips the chapters before the starting one and starts its first request', () => {
    const p = placeAfterSkillCheck(emptyProgress, 2);
    expect(p.quest).toEqual({ levelId: 'ch2-1', stage: 'talk' });
    expect(p.skipped).toContain('ch0-1');
    expect(p.skipped).toContain('ch1-7');
    expect(p.skipped).not.toContain('ch2-1');
    expect(p.completed).toEqual({});
    expect(p.coins).toBe(0);
    expect(isDone(p, 'ch1-3')).toBe(true);
    expect(isNewPlayer(p)).toBe(false);
  });

  it('starts a beginner at the very first level, with nothing skipped', () => {
    const p = placeAfterSkillCheck(emptyProgress, 0);
    expect(p.quest).toEqual({ levelId: 'ch0-1', stage: 'talk' });
    expect(p.skipped).toEqual([]);
  });

  it('greets only brand-new players (older saves count as offered)', () => {
    expect(isNewPlayer(emptyProgress)).toBe(true);
    expect(
      isNewPlayer(parseProgress(JSON.stringify({ currentLevelId: 'ch0-2', completed: { 'ch0-1': { hintsUsed: 0 } } }))),
    ).toBe(false);
  });
});
