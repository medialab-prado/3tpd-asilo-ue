
setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/data/")
options(stringsAsFactors = F)

library(tidyr)
library(dplyr)
library(readr)
library(ggplot2)

################## --> NOT RUN, READ CSV FILE BELLOW

# # READ THE FILE (sed) cleaned file (no ' d', ': ' and convert to comma separated values)
# 
# dec1 <- read_csv('rawData/dec1def.csv', col_names = T, col_types = 'cccccciiiiiii')
# 
# # To avoid consider Namibia code ('NA') as NA, switch to small letters character, 
# dec1$citizen[is.na(dec1$citizen)] <- 'nNA'
# 
# # # REMOVE THE TOTALS 
# citizenTotals <- c("EU28", "EXT_EU28", "TOTAL")
# geoTotals <- c("EU28", "TOTAL")
# decisionTotals <- c('TOTAL', 'TOTAL_POS', 'REJECTED')
# 
# dec1_no_totals <- dec1 %>%
#   filter(!(citizen %in% citizenTotals), sex != 'T', age != 'TOTAL', decision %in% decisionTotals, !(geo %in% geoTotals)) 
#   
# 
# dec_melt <- melt(dec1_no_totals, variable = 'year')
# dec_melt$year <- gsub('x', '', dec_melt$year, fixed = T)
# dec <- dcast(dec_melt, citizen + sex + age + geo + year ~ decision)
# 
# colnames(dec) <- c("citizen", "sex", "age", "geo",  "year",  "rejected", "total", "accepted")
# 
# dec <- dec %>%
#   mutate(suma = ifelse((rejected + accepted) != total, 'mal', 'bien'))
# 
# # NOT RUN: test, run the transform bellow
# # mal2 <- a %>% 
# #         mutate(newTotal = ifelse(mal == 'mal',  rejected + accepted, NA),
# #                difTotal = newTotal - total,
# #                newRejected = ifelse(is.na(mal) & !is.na(total), total - accepted, NA),
# #                difRej = newRejected - rejected)
# 
# dec2 <- dec %>% 
#         transform(total = ifelse(suma == 'mal',  rejected + accepted, total),
#                   rejected = ifelse(is.na(suma) & !is.na(total), total - accepted, rejected)) %>%
#         select(-suma)
# 
# write.csv(dec2, 'decisions_v2.csv', row.names = F)

################## --> END NOT RUN, READ CSV FILE

dec_v2 <- read_csv('decisions_v2.csv', col_names = T, col_types = 'ccccciii')


# DECODIFY THE VARIABLES
# Read the code files
codeFiles <- list.files('codes/')

for (i in codeFiles) {
  file <- paste('codes/', i, sep ='')
  temp <- read_csv2(file, col_names = T)
  objectName <- gsub('.csv', '', i)
  assign(objectName, temp)
}

countries$Label <- iconv(countries$Label, from="latin1", to='UTF8')
age$Label <- iconv(age$Label, from="latin1", to='UTF8')


# Rename the variables
dec_decod <- dec_v2 %>%
                rename(origin = citizen,
                       destiny = geo)

# --> !!!! <-- To avoid consider Namibia code ('NA') as NA, switch to small letters character, as we did in lines 30:32
countries$Code[is.na(countries$Code)] <- 'nNA'
countries[countries$Code == 'nNA', ]

## DECODE THE VARIABLES
# ORIGIN
dec_decod_origin <- left_join(dec_decod, countries, by = c("origin" = "Code"))
dec_decod_origin <- dec_decod_origin %>%
                      rename(origin_code = origin,
                             origin = Label,
                             origin_region = Region,
                             origin_continent = Continent,
                             origin_ue = Europe)

# DESTINY
dec_decod_dest <- left_join(dec_decod_origin, countries, by = c("destiny" = "Code"))
dec_decod_dest <- dec_decod_dest %>%
                      rename(destiny_code = destiny,
                            destiny = Label,
                            destiny_region = Region,
                            destiny_continent = Continent,
                            destiny_ue = Europe)

# SEX
dec_decod_sex <- left_join(dec_decod_dest, sex, by = c("sex" = "Code"))
dec_decod_sex <- dec_decod_sex %>%
  rename(sex_code = sex,
         sex = Label)

# AGE
dec_decod_age <- left_join(dec_decod_sex, age, by = c("age" = "Code"))
dec_decod_age <- dec_decod_age %>%
  rename(age_code = age,
         age = Label)

# WRITE FILE
write.csv(dec_decod_age, 'decisions_v2_decod_esp.csv', row.names = F)

