cls
set update=%1
git add .
git commit . -m "%update% | @dream-25"
git push -f origin itsmohan025
echo "Deploy Done"
