import {Employee} from "../proto/employees/Employee";

export class EmployeesDB {

    private employees: Employee[] = [];

    constructor(){
        this.employees = [
            {
                id: 1,
                badgeNumber: 2080,
                firstName: "Grace",
                lastName: "Decker",
                vacationAccrualRate: 2,
                vacationAccrued: 30,
            },
            {
                id: 2,
                badgeNumber: 7538,
                firstName: "Amity",
                lastName: "Fuller",
                vacationAccrualRate: 2.3,
                vacationAccrued: 23.4,
            },
            {
                id: 3,
                badgeNumber: 5144,
                firstName: "Keaton",
                lastName: "Willis",
                vacationAccrualRate: 3,
                vacationAccrued: 31.7,
            }
        ];

    }

    public getEmployeeByBadgeNumber(badgeNumber: number): Employee {
        const employee = this.employees.find(employee => employee.badgeNumber === badgeNumber);
        if(!employee) {
            throw new Error(`Employee with badge number ${badgeNumber} not found`)
        }
        return employee as Employee;
    }

    public saveEmployee(employee:Employee) {
        console.log(`Saving employee with badge number ${employee.badgeNumber}`)
        this.employees.push(employee);
    }

    public getAllEmployees(): Employee[] {
        return this.employees;
    }

}
