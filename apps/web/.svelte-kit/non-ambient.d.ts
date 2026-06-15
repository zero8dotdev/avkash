
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/blackouts" | "/admin/field-policies" | "/admin/holidays" | "/admin/leave-types" | "/admin/workweek-patterns" | "/attendance" | "/comp-off" | "/dashboard" | "/demo" | "/demo/api" | "/demo/api/apply-leave" | "/demo/api/cancel-leave" | "/employees" | "/employees/[id]" | "/leave" | "/login" | "/reports" | "/transfers";
		RouteParams(): {
			"/employees/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/admin": Record<string, never>;
			"/admin/blackouts": Record<string, never>;
			"/admin/field-policies": Record<string, never>;
			"/admin/holidays": Record<string, never>;
			"/admin/leave-types": Record<string, never>;
			"/admin/workweek-patterns": Record<string, never>;
			"/attendance": Record<string, never>;
			"/comp-off": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/demo": Record<string, never>;
			"/demo/api": Record<string, never>;
			"/demo/api/apply-leave": Record<string, never>;
			"/demo/api/cancel-leave": Record<string, never>;
			"/employees": { id?: string | undefined };
			"/employees/[id]": { id: string };
			"/leave": Record<string, never>;
			"/login": Record<string, never>;
			"/reports": Record<string, never>;
			"/transfers": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/blackouts" | "/admin/field-policies" | "/admin/holidays" | "/admin/leave-types" | "/admin/workweek-patterns" | "/attendance" | "/comp-off" | "/dashboard" | "/demo" | "/demo/api/apply-leave" | "/demo/api/cancel-leave" | "/employees" | `/employees/${string}` & {} | "/leave" | "/login" | "/reports" | "/transfers";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.svg" | string & {};
	}
}