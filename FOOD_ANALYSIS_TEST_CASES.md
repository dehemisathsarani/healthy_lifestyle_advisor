# Food Analysis System Test Cases

## Test Plan for Enhanced Food Analysis v2.0

### Test Categories

#### 1. Sri Lankan Food Recognition Tests

##### Test Case 1.1: Kottu Variations

- **Input**: "Chicken kottu large portion"
- **Expected**: ~585 cal (450 × 1.3), detailed breakdown with chicken
- **Input**: "Beef kottu small"
- **Expected**: ~315 cal (450 × 0.7), beef protein variation
- **Input**: "Seafood kottu"
- **Expected**: ~450 cal with seafood protein adjustments

##### Test Case 1.2: Rice and Curry Variations

- **Input**: "Rice and curry lunch"
- **Expected**: 520 cal, traditional breakdown
- **Input**: "Large rice and curry"
- **Expected**: ~728 cal (520 × 1.4)

##### Test Case 1.3: String Hoppers

- **Input**: "String hoppers with chicken curry"
- **Expected**: 320 cal with curry breakdown
- **Input**: "Idiyappam"
- **Expected**: Same as string hoppers (alternative name)

##### Test Case 1.4: Biriyani Recognition

- **Input**: "Chicken biriyani"
- **Expected**: 620 cal with basmati rice and spiced chicken
- **Input**: "Large chicken biryani"
- **Expected**: ~868 cal (620 × 1.4)

#### 2. International Food Recognition Tests

##### Test Case 2.1: Burger Variations

- **Input**: "Chicken burger"
- **Expected**: 540 cal with complete breakdown
- **Input**: "Big burger meal"
- **Expected**: ~756 cal (540 × 1.4)

##### Test Case 2.2: Pizza Analysis

- **Input**: "Pizza slice"
- **Expected**: 285 cal per slice
- **Input**: "2 slices pizza"
- **Expected**: 570 cal (285 × 2)
- **Input**: "3 pizza slices"
- **Expected**: 855 cal (285 × 3)

##### Test Case 2.3: Asian Cuisine

- **Input**: "Chicken ramen"
- **Expected**: 450 cal with noodles, broth, chicken
- **Input**: "Salmon sushi roll"
- **Expected**: 310 cal for 8 pieces

#### 3. Image Analysis Simulation Tests

##### Test Case 3.1: File Size Portion Detection

- **Simulated Large File (>3MB)**: kottu_large.jpg
- **Expected**: Large portion multiplier (1.4x)
- **Simulated Small File (<800KB)**: small_rice.jpg
- **Expected**: Small portion multiplier (0.7x)

##### Test Case 3.2: Filename Keyword Detection

- **Input**: chicken_fried_rice_dinner.jpg
- **Expected**: Detect "chicken", "fried", "rice", "dinner"
- **Analysis**: Fried rice with cooking method adjustment

#### 4. Fallback Analysis Tests

##### Test Case 4.1: Component-Based Analysis

- **Input**: "Grilled chicken with rice and vegetables"
- **Expected**: Chicken (165 cal) + Rice (250 cal) + Vegetables (50 cal) = 465 cal
- **Input**: "Fried chicken with fries"
- **Expected**: Higher calorie content due to frying method

##### Test Case 4.2: Meal Type Intelligence

- **Input**: "Breakfast"
- **Expected**: 300 cal baseline with breakfast characteristics
- **Input**: "Dinner"
- **Expected**: 500 cal baseline with dinner characteristics

##### Test Case 4.3: Cooking Method Adjustments

- **Input**: "Fried fish with bread"
- **Expected**: Fish calories × 1.3 (fried multiplier)
- **Input**: "Steamed fish with rice"
- **Expected**: Fish calories × 0.9 (healthy cooking multiplier)

#### 5. Edge Cases and Error Handling

##### Test Case 5.1: Ambiguous Descriptions

- **Input**: "Food"
- **Expected**: Default mixed meal (350 cal)
- **Input**: "Something spicy"
- **Expected**: Fallback analysis based on available context

##### Test Case 5.2: Multiple Foods

- **Input**: "Pizza and burger"
- **Expected**: Should detect first recognized food (pizza)
- **Input**: "Rice curry and kottu"
- **Expected**: Should detect first recognized food (rice curry)

#### 6. Accuracy Validation Tests

##### Test Case 6.1: Known Nutritional Comparisons

- **Kottu (450 cal)** vs **USDA equivalent** (mixed grain dish ~400-500 cal)
- **Rice and Curry (520 cal)** vs **Traditional Sri Lankan meal** (500-600 cal)
- **Chicken Burger (540 cal)** vs **Fast food equivalent** (500-600 cal)

##### Test Case 6.2: Portion Size Accuracy

- **Small kottu (315 cal)** vs **Large kottu (630 cal)**
- **Expected ratio**: ~2:1 (actual: 2x)

### Test Execution Checklist

#### Functional Tests

- [ ] All Sri Lankan dishes recognized correctly
- [ ] International dishes identified properly
- [ ] Portion size adjustments working
- [ ] Meat variations applied correctly
- [ ] Cooking method multipliers functional
- [ ] Fallback analysis comprehensive
- [ ] Component breakdown accurate

#### Performance Tests

- [ ] Analysis completes within 2-3 seconds
- [ ] No memory leaks during repeated analysis
- [ ] Handles large image files efficiently
- [ ] Responsive UI during processing

#### User Experience Tests

- [ ] Clear nutritional breakdown display
- [ ] Intuitive portion size descriptions
- [ ] Helpful component explanations
- [ ] Error messages user-friendly
- [ ] Loading states informative

### Expected Accuracy Metrics

#### By Food Category

- **Sri Lankan Traditional**: 90-95% accuracy
- **International Popular**: 85-90% accuracy
- **Component-based Fallback**: 80-85% accuracy
- **Portion Size Estimation**: 75-80% accuracy

#### By Analysis Type

- **Text Description**: 85-95% accuracy
- **Image Name Analysis**: 70-80% accuracy
- **Combined Image + Text**: 90-95% accuracy
- **Fallback Analysis**: 75-85% accuracy

### Testing Environment Setup

#### Prerequisites

1. Diet Agent component loaded
2. Enhanced food database active
3. Image upload functionality enabled
4. Text description input working

#### Test Data

- Sample food images with various filenames
- Text descriptions of different complexity
- Edge case inputs for error handling
- Known nutritional values for comparison

### Success Criteria

#### Must Have

- [ ] Accurately analyze top 20 Sri Lankan dishes
- [ ] Correctly identify top 15 international foods
- [ ] Handle portion size variations properly
- [ ] Provide meaningful fallback analysis
- [ ] Display comprehensive nutritional breakdown

#### Should Have

- [ ] Detect cooking methods and adjust calories
- [ ] Handle meat variations automatically
- [ ] Provide helpful component explanations
- [ ] Suggest portion adjustments
- [ ] Include cultural context in descriptions

#### Nice to Have

- [ ] Learn from user corrections
- [ ] Suggest similar foods
- [ ] Provide cooking tips
- [ ] Integrate with meal planning
- [ ] Export nutritional data

### Bug Tracking Template

#### Issue Format

```
**Title**: [Food Type] - [Issue Description]
**Priority**: High/Medium/Low
**Category**: Recognition/Calculation/UI/Performance
**Steps to Reproduce**:
1.
2.
3.
**Expected Result**:
**Actual Result**:
**Environment**: Browser/OS version
**Additional Notes**:
```

This comprehensive test plan ensures the enhanced food analysis system meets quality standards and provides accurate nutritional information for users.
