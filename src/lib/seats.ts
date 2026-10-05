import type { Layout } from './types.ts';

export function isSeatDisabled(layout: Layout, id: string): boolean {
	return layout.kind === 'tables' && /^(C|F)(9|1[0-6])$/.test(id);
}
