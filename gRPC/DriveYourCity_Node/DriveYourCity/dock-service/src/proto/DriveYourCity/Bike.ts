// Original file: ../proto/Entities.proto

import type { Dock as _DriveYourCity_Dock, Dock__Output as _DriveYourCity_Dock__Output } from '../DriveYourCity/Dock';

export interface Bike {
  'id'?: (number);
  'dock'?: (_DriveYourCity_Dock | null);
}

export interface Bike__Output {
  'id'?: (number);
  'dock'?: (_DriveYourCity_Dock__Output);
}
