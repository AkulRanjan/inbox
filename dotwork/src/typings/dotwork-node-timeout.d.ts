/*---------------------------------------------------------------------------------------------
 *  Dotwork: makes Node's timer handle satisfy VS Code's opaque `TimeoutHandle` (base-common.d.ts),
 *  so VS Code's sources type-check unchanged when @types/node is loaded in the same program.
 *--------------------------------------------------------------------------------------------*/

declare global {
	namespace NodeJS {
		interface Timeout {
			readonly _: never;
		}
	}
}

export { };
