export function isWithinTargetTolerance(
  sizeBytes: number,
  targetSizeBytes: number,
  tolerance: number,
): boolean {
  if (sizeBytes > targetSizeBytes) {
    return false;
  }

  return targetSizeBytes - sizeBytes <= targetSizeBytes * tolerance;
}

export function getTargetSizeNote(
  sizeBytes: number,
  targetSizeBytes: number,
  tolerance: number,
): string | undefined {
  if (isWithinTargetTolerance(sizeBytes, targetSizeBytes, tolerance)) {
    return undefined;
  }

  if (sizeBytes <= targetSizeBytes) {
    return 'Returned the closest result under the requested size budget.';
  }

  return 'The closest browser-generated result is still above the requested size budget.';
}
