// Original file: ../proto/Entities.proto

import type { Bike as _DriveYourCity_Bike, Bike__Output as _DriveYourCity_Bike__Output } from '../DriveYourCity/Bike';
import type { Dock as _DriveYourCity_Dock, Dock__Output as _DriveYourCity_Dock__Output } from '../DriveYourCity/Dock';

export interface Ride {
  'id'?: (number);
  'km'?: (number);
  'bike'?: (_DriveYourCity_Bike | null);
  'originDock'?: (_DriveYourCity_Dock | null);
  'targetDock'?: (_DriveYourCity_Dock | null);
}

export interface Ride__Output {
  'id'?: (number);
  'km'?: (number);
  'bike'?: (_DriveYourCity_Bike__Output);
  'originDock'?: (_DriveYourCity_Dock__Output);
  'targetDock'?: (_DriveYourCity_Dock__Output);
}
