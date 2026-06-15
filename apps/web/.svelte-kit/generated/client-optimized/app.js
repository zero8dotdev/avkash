export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19')
];

export const server_loads = [0,2];

export const dictionary = {
		"/": [~3],
		"/admin": [~4,[2]],
		"/admin/blackouts": [~5,[2]],
		"/admin/field-policies": [~6,[2]],
		"/admin/holidays": [~7,[2]],
		"/admin/leave-types": [~8,[2]],
		"/admin/workweek-patterns": [~9,[2]],
		"/attendance": [~10],
		"/comp-off": [~11],
		"/dashboard": [~12],
		"/demo": [~13],
		"/employees": [~14],
		"/employees/[id]": [~15],
		"/leave": [~16],
		"/login": [~17],
		"/reports": [~18],
		"/transfers": [~19]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';