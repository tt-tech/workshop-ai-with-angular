import { Pipe, PipeTransform } from '@angular/core';
import { formatMad } from '@atlas/domain';

@Pipe({ name: 'mad' })
export class MadPipe implements PipeTransform {
  transform(amount: number | null | undefined): string {
    return amount === null || amount === undefined ? '' : formatMad(amount);
  }
}
