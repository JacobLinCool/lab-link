export type Role = 'student' | 'ta';
export type CallStatus = 'waiting' | 'serving';
export type CallAction = 'claim' | 'complete' | 'cancel';

export interface Point {
	x: number;
	y: number;
}

export interface Seat extends Point {
	id: string;
}

export interface Table extends Point {
	id: string;
	w: number;
	h: number;
}

export type Layout =
	| { kind: 'tables'; tableRows: number; tableColumns: number; seatsPerSide: number }
	| { kind: 'rows'; rows: number; columns: number };

export interface Room {
	id: string;
	name: string;
	course: string;
	layout: Layout;
	seats: Seat[];
	tables: Table[];
	seatIds?: string[];
	activeCount?: number;
}

export interface Call {
	id: string;
	uid: string;
	room: string;
	seat: string;
	name: string;
	createdAt: number;
	status: CallStatus;
	assistant?: string | null;
}

export interface Assistant {
	id: string;
	name: string;
	room: string;
	seat?: string;
	active: boolean;
	currentCall?: string | null;
}

export interface HistoryEntry extends Call {
	assistant: string;
	completedAt: number;
}

export interface User {
	uid: string;
	name: string;
	email: string;
	studentId: string;
	role: Role;
}

export interface State {
	rooms: Room[];
	calls: Call[];
	assistants: Assistant[];
	history: HistoryEntry[];
}
