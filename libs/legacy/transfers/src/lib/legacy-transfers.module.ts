import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransferComponent } from './transfer.component';
import { TransferService } from './transfer.service';

// LEGACY — frozen. Routed NgModule, the shape most enterprise Angular apps still carry.
@NgModule({
  imports: [CommonModule, RouterModule.forChild([{ path: 'new/:accountId', component: TransferComponent }])],
  declarations: [TransferComponent],
  providers: [TransferService],
})
export class LegacyTransfersModule {}
