
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
# 
# # REMOVE THE TOTALS
# citizenTotals <- c("EU28", "EXT_EU28", "TOTAL")
# geoTotals <- c("EU28", "TOTAL")
# decisionTotals <- c('TOTAL', 'TOTAL_POS', 'REJECTED')
# 
# dec1_no_totals <- dec1 %>%
#   filter(!(citizen %in% citizenTotals), sex != 'T', age != 'TOTAL', decision %in% decisionTotals, !(geo %in% geoTotals))
# 
# dec_melt <- melt(dec1_no_totals, variable = 'year')
# dec_melt$year <- gsub('x', '', dec_melt$year, fixed = T)
# dec <- dcast(dec_melt, citizen + sex + age + geo + year ~ decision)
# 
# colnames(dec) <- c("citizen", "sex", "age", "geo",  "year",  "rejected", "total", "accepted")
# 
# # To avoid consider Namibia code ('NA') as NA, switch to small letters character, 
# 
# dec$citizen[is.na(dec$citizen)] <- 'nNA'
# 
# new_df <- data_frame()
# 
# # Calculate accepted/rejected based in totals
# for (dest in unique(dec$geo)) {
#   print(dest)
#   temp_dest <- filter(dec, geo == dest)
#   nas <- temp_dest[ is.na(temp_dest[,c(6:8)]), ]
#   if (nrow(nas) == 0) {
#     new_df <- rbind(temp_dest, new_df)
#   } else {
#     for (y in unique(temp_dest$year)) {
#       temp_y <- filter(temp_dest, year == y)
#       nas <- temp_y[is.na(temp_y[,c(6:8)]), ]
#       if (nrow(nas) == 0) {
#         new_df <- rbind(temp_y, new_df)
#       } else if (nrow(nas) == nrow(temp_y)) {
#         temp_y <- mutate(temp_y, rejected = 0, total = 0, accepted = 0)
#         new_df <- rbind(temp_y, new_df)
#       } else {
#         for(ori in unique(temp_y$citizen)) {
#           temp_ori <- filter(temp_y, citizen == ori)
#           nas <- temp_ori[is.na(temp_ori[,c(6:8)]), ]
#           if (nrow(nas) == 0) {
#             new_df <- rbind(temp_ori, new_df)
#           } else if (nrow(nas) == nrow(temp_y)) {
#             temp_ori <- mutate(temp_ori, rejected = 0, total = 0, accepted = 0)
#             new_df <- rbind(temp_ori, new_df)
#           } else {
#             for(a in unique(temp_ori$age)) {
#               temp_a <- filter(temp_ori, age == a)
#               nas <- temp_a[is.na(temp_a[,c(6:8)]), ]
#               if (nrow(nas) == 0) {
#                 new_df <- rbind(temp_a, new_df)
#               } else {
#                 for(s in unique(temp_a$sex)) {
#                   temp_s <- filter(temp_a, sex == s)
#                   nas <- temp_s[is.na(temp_s[,c(6:8)]), ]
#                   if (nrow(nas) == 0) {
#                     new_df <- rbind(temp_s, new_df)
#                   } else{
#                     if (is.na(temp_s$rejected) && is.na(temp_s$total) && is.na(temp_s$accepted)) {
#                       temp_s <- temp_s %>% mutate(rejected = 0, total = 0, accepted = 0)
#                       new_df <- rbind(temp_s, new_df)
#                     } else if (is.na(temp_s$total)) {
#                       
#                       temp_s <- temp_s %>% mutate(total = rejected + accepted)
#                       new_df <- rbind(temp_s, new_df)
#                     } else if (is.na(temp_s$rejected)) {
#                       temp_s <- temp_s %>% mutate(rejected = total - accepted)
#                       new_df <- rbind(temp_s, new_df)
#                     } else if (is.na(temp_s$accepted)) {
#                       temp_s <- temp_s %>% mutate(accepted = total - rejected)
#                       new_df <- rbind(temp_s, new_df)
#                     } else {
#                       print(temp_s)
#                     }
#                   }
#                 }
#               }              
#             }
#           }
#         }
#       }
#     }
#   }
# }
# 
# write.csv(new_df, 'decisions_v2.csv', row.names = F)

################## --> END NOT RUN, READ CSV FILE

dec_v2 <- read_csv('decisions_v2.csv')


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
dec_decod <- dec_v2 %>%
                rename(origin = citizen,
                       destiny = geo)

# --> !!!! <-- To avoid consider Namibia code ('NA') as NA, switch to small letters character, as we did in lines 30:32
countries$Code[is.na(countries$Code)] <- 'nNA'
countries[countries$Code == 'nNA', ]


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
write.csv(dec_decod_age, 'decisions_v2_comp_decod.csv', row.names = F)

