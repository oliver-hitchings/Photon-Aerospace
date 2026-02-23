import { useEffect, useRef } from 'react';
import { initMissionDemo } from '../mission/missionDemo';

export function useMissionDemo() {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!shellRef.current) {
      return;
    }

    return initMissionDemo(shellRef.current);
  }, []);

  return shellRef;
}
