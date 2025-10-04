@echo off
chcp 65001 >nul

echo Creating Nutch configuration...

:: Create seed list with relevant URLs
(
echo https://www.g2.com/categories/load-testing
echo https://www.capterra.com/load-testing-software/
echo https://www.trustradius.com/load-testing
echo https://www.getapp.com/performance-management-software/
echo https://stackoverflow.com/questions/tagged/performance-testing
echo https://www.reddit.com/r/softwaretesting/
echo https://www.linkedin.com/search/results/companies/?keywords=performance^%20testing
echo https://github.com/topics/load-testing
echo https://aws.amazon.com/blogs/devops/tag/performance-testing/
echo https://azure.microsoft.com/en-us/blog/tag/performance/
) > nutch_data\urls\seed.txt

:: Create regex-urlfilter.txt
(
echo -\.^(gif^|GIF^|jpg^|JPG^|png^|PNG^|ico^|ICO^|css^|CSS^|sit^|SIT^|eps^|EPS^|wmf^|WMF^|zip^|ZIP^|ppt^|PPT^|mpg^|MPG^|xls^|XLS^|gz^|GZ^|rpm^|RPM^|tgz^|TGZ^|mov^|MOV^|exe^|EXE^|jpeg^|JPEG^|bmp^|BMP^|js^|JS^)$
echo -^[*?@=]
echo +.
) > nutch_data\conf\regex-urlfilter.txt

:: Create nutch-site.xml
(
echo ^<?xml version="1.0"?^>
echo ^<?xml-stylesheet type="text/xsl" href="configuration.xsl"?^>
echo ^<configuration^>
echo   ^<property^>
echo     ^<name^>http.agent.name^</name^>
echo     ^<value^>AILeadFinderBot^</value^>
echo   ^</property^>
echo   ^<property^>
echo     ^<name^>http.robots.agents^</name^>
echo     ^<value^>AILeadFinderBot^</value^>
echo   ^</property^>
echo   ^<property^>
echo     ^<name^>parser.character.encoding.default^</name^>
echo     ^<value^>utf-8^</value^>
echo   ^</property^>
echo   ^<property^>
echo     ^<name^>plugin.includes^</name^>
echo     ^<value^>protocol-http^|urlfilter-regex^|parse-^(html^|tika^)^|index-^(basic^|more^)^|scoring-opic^|urlnormalizer-^(pass^|regex^|basic^)^</value^>
echo   ^</property^>
echo   ^<property^>
echo     ^<name^>db.ignore.internal.links^</name^>
echo     ^<value^>false^</value^>
echo   ^</property^>
echo   ^<property^>
echo     ^<name^>generate.max.count^</name^>
echo     ^<value^>50000^</value^>
echo   ^</property^>
echo ^</configuration^>
) > nutch_data\conf\nutch-site.xml

echo ✅ Nutch configuration created!