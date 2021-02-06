import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipesSummaryComponent } from './recipes-summary.component';

describe('RecipesSummaryComponent', () => {
  let component: RecipesSummaryComponent;
  let fixture: ComponentFixture<RecipesSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecipesSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipesSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
