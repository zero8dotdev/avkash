const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.aIL1vy0w.js",app:"_app/immutable/entry/app.CIOO24Tc.js",imports:["_app/immutable/entry/start.aIL1vy0w.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/entry/app.CIOO24Tc.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/DxLrmQ3r.js","_app/immutable/chunks/CfUpXnJf.js","_app/immutable/chunks/BI7nSIaz.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-C0VrmnP3.js')),
			__memo(() => import('./chunks/1-7YAPsIM5.js')),
			__memo(() => import('./chunks/2-OSbC1vxP.js')),
			__memo(() => import('./chunks/3-CBhofGKD.js')),
			__memo(() => import('./chunks/4-De4wOxJZ.js')),
			__memo(() => import('./chunks/5-hxuzBxzW.js')),
			__memo(() => import('./chunks/6-DRgOf0FA.js')),
			__memo(() => import('./chunks/7-DkEa2F2C.js')),
			__memo(() => import('./chunks/8-BnzcWV9z.js')),
			__memo(() => import('./chunks/9-CV5lXSlI.js')),
			__memo(() => import('./chunks/10-CL9cX6nT.js')),
			__memo(() => import('./chunks/11-BiKz8Kyj.js')),
			__memo(() => import('./chunks/12-DBT_Tbju.js')),
			__memo(() => import('./chunks/13-B9EI46sy.js')),
			__memo(() => import('./chunks/14-DdxBhQwC.js')),
			__memo(() => import('./chunks/15-DEzQluYh.js')),
			__memo(() => import('./chunks/16-CA7do9ej.js')),
			__memo(() => import('./chunks/17-D8RfjUAx.js')),
			__memo(() => import('./chunks/18-DGDYTa-U.js')),
			__memo(() => import('./chunks/19-BUWZMNY4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/admin/blackouts",
				pattern: /^\/admin\/blackouts\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/admin/field-policies",
				pattern: /^\/admin\/field-policies\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/admin/holidays",
				pattern: /^\/admin\/holidays\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/admin/leave-types",
				pattern: /^\/admin\/leave-types\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/admin/workweek-patterns",
				pattern: /^\/admin\/workweek-patterns\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/attendance",
				pattern: /^\/attendance\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/comp-off",
				pattern: /^\/comp-off\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/demo",
				pattern: /^\/demo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/demo/api/apply-leave",
				pattern: /^\/demo\/api\/apply-leave\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-MghdsiZI.js'))
			},
			{
				id: "/demo/api/cancel-leave",
				pattern: /^\/demo\/api\/cancel-leave\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bz4mNUlh.js'))
			},
			{
				id: "/employees",
				pattern: /^\/employees\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/employees/[id]",
				pattern: /^\/employees\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/leave",
				pattern: /^\/leave\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/reports",
				pattern: /^\/reports\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/transfers",
				pattern: /^\/transfers\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
