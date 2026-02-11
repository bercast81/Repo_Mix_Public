// Original file: proto/employees.proto


export interface Employee {
  'id'?: (number);
  'badgeNumber'?: (number);
  'firstName'?: (string);
  'lastName'?: (string);
  'vacationAccrualRate'?: (number | string);
  'vacationAccrued'?: (number | string);
}

export interface Employee__Output {
  'id'?: (number);
  'badgeNumber'?: (number);
  'firstName'?: (string);
  'lastName'?: (string);
  'vacationAccrualRate'?: (number);
  'vacationAccrued'?: (number);
}
