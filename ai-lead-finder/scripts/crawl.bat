@echo off
chcp 65001 >nul

echo Starting Apache Nutch crawl for AI performance testing leads...

:: Inject seed URLs
docker exec nutch-crawler /root/nutch/bin/nutch inject /root/nutch/runtime/local/urls

:: Generate fetch list
docker exec nutch-crawler /root/nutch/bin/nutch generate -topN 10000

:: Fetch content
docker exec nutch-crawler /root/nutch/bin/nutch fetch -all

:: Parse fetched content
docker exec nutch-crawler /root/nutch/bin/nutch parse -all

:: Update database
docker exec nutch-crawler /root/nutch/bin/nutch updatedb

:: Index to Elasticsearch
docker exec nutch-crawler /root/nutch/bin/nutch index -all

echo ✅ Crawl completed successfully!