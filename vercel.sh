if [[ "$VERCEL_GIT_COMMIT_REF" == "dev" || "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then 
  echo "✅ - Build can proceed"; exit 0; 
else 
  echo "⛔ - Build canceled for branch $VERCEL_GIT_COMMIT_REF"; exit 1; 
fi
