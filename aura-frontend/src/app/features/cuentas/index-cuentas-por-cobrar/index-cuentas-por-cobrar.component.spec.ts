import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexCuentasPorCobrarComponent } from './index-cuentas-por-cobrar.component';

describe('IndexCuentasPorCobrarComponent', () => {
  let component: IndexCuentasPorCobrarComponent;
  let fixture: ComponentFixture<IndexCuentasPorCobrarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndexCuentasPorCobrarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndexCuentasPorCobrarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
