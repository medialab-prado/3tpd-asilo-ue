library(tidyr)
library(dplyr)
library(readr)

setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/data/")
options(stringsAsFactors = F)


# READ THE FILE (sed) cleaned file (no ' d', ': ' and convert to comma separated values)

dec1 <- read_csv('rawData/dec1def.csv', col_names = T, col_types = 'cccccciiiiiii')

# REMOVE THE TOTALS
citizenTotals <- c("EU28", "EXT_EU28", "TOTAL")
decisionTotals <- c("TOTAL","TOTAL_POS")
geoTotals <- c("EU28", "TOTAL")

dec1_no_totals <- dec1 %>%
  filter(!(citizen %in% citizenTotals), sex != 'T', age != 'TOTAL', !(decision %in% decisionTotals), !(geo %in% geoTotals))

rm(citizenTotals, decisionTotals, geoTotals)

# DECODIFY THE VARIABLES
# Read the code files
codeFiles <- list.files('codes/')

for (i in codeFiles) {
  file <- paste('codes/', i, sep ='')
  temp <- read_csv2(file, col_names = T)
  objectName <- gsub('.csv', '', i)
  assign(objectName, temp)
}

# Assign the labels to each code
dec1_decodified <- dec1_no_totals
codeObjects <- colnames(dec1_decodified[1:5])

# To avoid consider Namibia code ('NA') as NA, switch to small letters character, 

countries$Code[is.na(countries$Code)] <- 'nNA'
countries[countries$Code == 'nNA', ]

dec1_decodified$citizen[is.na(dec1_decodified$citizen)] <- 'nNA'
dec1_decodified[dec1_decodified$citizen == 'nNA', ]


# codeObjects <- 'citizen'

for (object in codeObjects) {
    temporary <- data_frame()
    if (object == 'citizen' | object == 'geo') {
      dfCodes <- countries
    } else {
      dfCodes <- eval(parse(text = object))
    }
    print(paste('----->', object))
    for (i in 1:nrow(dfCodes)) {
      code <- dfCodes$Code[i]
      label <- dfCodes$Label[i]
#       print(code)
#       print(label)
      
      temp <- eval(parse( text=paste('filter(dec1_decodified, ', object, ' == code)', sep = "")))
      
      if (nrow(temp) != 0) {
        temp$newVar <- label
        if (object == 'citizen') {
          temp$citizen_region <- dfCodes$Region[i]
          temp$citizen_continent <- dfCodes$Continent[i]
          temp$citizen_europe <- dfCodes$Europe[i]
        } else if (object == 'geo') {
          temp$geo_region <- dfCodes$Region[i]
          temp$geo_continent <- dfCodes$Continent[i]
          temp$geo_europe <- dfCodes$Europe[i]
        }
        colnames(temp) <- gsub('newVar', paste(object, '_label', sep = ''), colnames(temp))
        temporary <- rbind(temporary, temp)
      } 
    }
    print(nrow(temporary))
    dec1_decodified <- temporary
}

# REMOVE USELESS COLUMNS
dec1_decodified <- select(dec1_decodified, 7:24)

# Improve colnames
colnames(dec1_decodified) <- gsub('citizen', 'origin', colnames(dec1_decodified), fixed = T)
colnames(dec1_decodified) <- gsub('geo', 'destiny', colnames(dec1_decodified), fixed = T)

# Add a accepted/rejected column
tempAccepted <- filter(dec1_decodified, decision_label != 'Rejected')
tempAccepted$decision_fin <- 'Accepted'
tempRejected <- filter(dec1_decodified, decision_label == 'Rejected')
tempRejected$decision_fin <- 'Rejected'

dec1_decodified <- rbind(tempAccepted, tempRejected)

# Add values to blank region/continent...
for (i in 1:nrow(dec1_decodified)) {
  if (dec1_decodified$origin_region[i] == '') {
    value <- dec1_decodified$origin_label[i]
    dec1_decodified$origin_region[i] <- value
    dec1_decodified$origin_continent[i] <- value
    dec1_decodified$origin_europe[i] <- value
  }
}

for (i in 1:nrow(dec1_decodified)) {
  if (dec1_decodified$destiny_region[i] == '') {
    value <- dec1_decodified$destiny_label[i]
    dec1_decodified$destiny_region[i] <- value
    dec1_decodified$destiny_continent[i] <- value
    dec1_decodified$destiny_europe[i] <- value
  }
}

# Shorter names to reduce size 
dec1_decodified$origin_europe[ dec1_decodified$origin_europe == 'European Union (28 countries)'] <- 'EU-28'
dec1_decodified$origin_europe[ dec1_decodified$destiny_europe == 'European Union (28 countries)'] <- 'EU-28'

# WRITE FILE
write.csv(dec1_decodified, 'decisions_def.csv', row.names = F)

