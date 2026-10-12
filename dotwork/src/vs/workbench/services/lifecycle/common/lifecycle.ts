import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const ILifecycleService = createDecorator<ILifecycleService>('lifecycleService');

/** Handles window shutdown: unsaved editors get a save prompt before the window closes. */
export interface ILifecycleService {
	readonly _serviceBrand: undefined;
}
