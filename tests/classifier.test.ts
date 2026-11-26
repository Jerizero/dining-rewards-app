import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCuisine, getNeighborhood } from '../scripts/classifier.cjs';

// JER-806: Swagat (Indian, Midtown) and Grotta Azzurra (Italian, Little
// Italy/Nolita) rendered wrong on the live feed.

test('Swagat-classifies as Indian, not American', () => {
  // Swagat carries 'indian' in its source tags.
  assert.equal(getCuisine('Swagat chill indian authentic'), 'Indian');
  assert.equal(getCuisine('Tandoor House tandoor curry'), 'Indian');
});

test('Swagat Manhattan coords never map to Brooklyn', () => {
  const hood = getNeighborhood(40.7835, -73.9777, '411A Amsterdam Ave', 'New York');
  assert.notEqual(hood, 'Brooklyn');
  assert.equal(hood, 'Upper West Side');
});

test('Grotta Azzurra: Little Italy coords are Nolita, not Brooklyn, even with a non-Manhattan city string', () => {
  // Regression: coords 40.7203 / -73.997 fell into the Brooklyn bounding box
  // when the city arg was a neighborhood name like 'Tribeca'.
  const hood = getNeighborhood(40.72031021118164, -73.99702453613281, '177 Mulberry St', 'Tribeca');
  assert.equal(hood, 'Nolita');
  assert.notEqual(hood, 'Brooklyn');
});

test('Grotta Azzurra stays Italian', () => {
  assert.equal(getCuisine('Grotta Azzurra italian extensive wine list brunch'), 'Italian');
});

test('Chinatown/Little Italy band maps to Chinatown & Little Italy', () => {
  const hood = getNeighborhood(40.714, -73.997, '', '');
  assert.equal(hood, 'Chinatown & Little Italy');
});

test('Williamsburg coords are Brooklyn even with a New York city string', () => {
  assert.equal(getNeighborhood(40.72, -73.95, '', 'New York'), 'Williamsburg');
});

test('DUMBO stays Brooklyn', () => {
  const hood = getNeighborhood(40.702, -73.99, '', 'Brooklyn');
  assert.equal(hood, 'DUMBO & Heights');
});

test('new cuisine buckets classify from source text', () => {
  assert.equal(getCuisine('Pad Thai Kitchen thai'), 'Thai');
  assert.equal(getCuisine('Szechuan dumpling house chinese dim sum'), 'Chinese');
  assert.equal(getCuisine('Banh Mi Saigon vietnamese pho'), 'Vietnamese');
  assert.equal(getCuisine('Keens chophouse steak'), 'Steakhouse');
  assert.equal(getCuisine('Raw bar oyster seafood'), 'Seafood');
  assert.equal(getCuisine('Souvlaki taverna greek'), 'Greek');
  assert.equal(getCuisine('Tapas bar spanish paella'), 'Spanish');
  assert.equal(getCuisine('Hummus falafel shawarma middle eastern'), 'Middle Eastern');
});

test('existing buckets still classify', () => {
  assert.equal(getCuisine('Omakase sushi ramen japanese'), 'Japanese');
  assert.equal(getCuisine('Trattoria pasta pizza italian'), 'Italian');
  assert.equal(getCuisine('Taqueria tacos mexican'), 'Mexican');
  assert.equal(getCuisine('Wine bar cocktail lounge'), 'Cocktails & Bar');
  assert.equal(getCuisine('Some Venue'), 'American');
});
