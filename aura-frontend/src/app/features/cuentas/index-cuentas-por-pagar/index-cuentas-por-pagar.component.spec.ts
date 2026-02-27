import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexCuentasPorPagarComponent } from './index-cuentas-por-pagar.component';

describe('IndexCuentasPorPagarComponent', () => {
  let component: IndexCuentasPorPagarComponent;
  let fixture: ComponentFixture<IndexCuentasPorPagarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndexCuentasPorPagarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndexCuentasPorPagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
