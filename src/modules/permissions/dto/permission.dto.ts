import { Action } from 'src/modules/auth/enums/action.enum';
import { Subject } from 'src/modules/auth/enums/subject.enum';

export class Permission {
  subject: Subject;
  actions: Action[];
}
