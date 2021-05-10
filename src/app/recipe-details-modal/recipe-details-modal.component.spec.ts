import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeDetailsModalComponent } from './recipe-details-modal.component';

describe('RecipeDetailsModalComponent', () => {
  let component: RecipeDetailsModalComponent;
  let fixture: ComponentFixture<RecipeDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecipeDetailsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
