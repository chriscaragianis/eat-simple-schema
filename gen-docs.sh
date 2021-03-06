#! /usr/local/bin/zsh

echo "Remove old data"
rm -rf src/data
rm -f temp

echo "Get schema sources from $1"
ruby getSchema.rb $1 src/data >> temp
mv temp src/data/collect.js

echo "Replace dependencies"
./proc-schema.sh src/data
cp $1/api/App/SchemaHelper.js src/App
ruby shEdit.rb

echo "AD HOC: Remove OrderLineStats (duplicated in OrderLines???)"
sed -i '' '/OrderLineStats/d' ./src/data/collect.js
rm -f src/data/OrderLineStats.schema.js

echo "Replace Enums"
mkdir -p src/App/Enums
cp -r $2/* src/App/Enums

echo "YAML conversion"
npm run compile
node lib/index.js
