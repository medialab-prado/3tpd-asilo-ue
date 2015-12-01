setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/")
options(stringsAsFactors = F)

library(readr)
library(dplyr)
library(ggplot2)
library(jsonlite)


# Load the data
# decisions <- read_csv('data/decisions_def.csv', col_names = T, col_types = 'iiiiiiicccccccccccc')

dec2 <- read_csv('data/decisions_v2_comp_decod.csv', col_names = T, col_types = 'cccciiiicccccccccc')


# Subset the UE-28 applications
df <- dec2 %>% 
  filter(destiny_ue == 'EU-28') %>%
  select(year, origin, destiny, sex, age, rejected, accepted)

# Remove NAs and accepted & rejected == 0 to run the mode
df_logit <- df %>%
  filter(!is.na(rejected),
         (accepted + rejected) != 0)


####################### Add new columns
df_logit <- df_logit %>%
  mutate (total = accepted + rejected,
          prop_accepted = accepted / total)


# LOGIT
logit <- glm(prop_accepted ~ year + age + sex + destiny + origin, weights = total, family='binomial', data=df_logit) 
summary(logit)

# Success probability for every year, equal to prop_accepted( so, proportion of accepted == probability to be accepted)
df_logit$real2104 <- predict(logit, type = "response")

# Predict 2014 to compare to the real value
df_short <- filter(df_logit, year != 2014)

logit_test <- glm(prop_accepted ~ year + age + sex + destiny + origin, weights = total, family='binomial', data=df_short) 
summary(logit_test)


# Predict for year 2014, based on logit_test
x2014 <- filter(df_logit, year == 2014)
logit_test$xlevels[['origin']] <- union(logit_test$xlevels[['origin']], levels(factor(x2014$origin)))
x2014$predict2014 <- predict(logit_test, newdata = x2014, type = "response") 

plot(x2014$real2014, x2014$predict2014)
abline(a=0, b=1, col= 'red')


# Prediction for 2015 

# Get all the combinations and paste the total applications for the seven years
totals <- aggregate(cbind(accepted, rejected) ~ origin + destiny + sex + age, data = df, sum)
totals <- totals %>% 
  rename(accepted_total = accepted,
         rejected_total = rejected) %>%
  mutate(total = accepted_total + rejected_total)

df_2015 <- totals %>%
    mutate(year = 2015) %>%
    filter(origin %in% logit$xlevels[['origin']]) ## Remove from df_2015 the origin countries that are not in the logit

# Predict over this df
df_2015$predict2015 <- predict(logit, newdata = df_2015, type = "response") 

# Remove the variable year, as no needed, and round the prediction
df_2015$year <- NULL
df_2015 <- df_2015 %>%
    transform(predict2015 = ifelse(total == 0, NA, round(predict2015, 4)))

# Write the csv
write.csv(df_2015, 'data/predict2015.csv', row.names = F)

# Write the short version, filtering those values that are not NAs
df_2015_short <- df_2015 %>% filter(!is.na(predict2015))
write.csv(df_2015_short, 'data/predict2015_short.csv', row.names = F)


## Get JSONs to develop the form

# Origin
df_form_origin <- dec2 %>% 
  filter(origin %in% df_2015$origin) %>%
  select(origin_code, origin, origin_continent) %>%
  distinct() %>%
  transform(origin = ifelse(origin_code == 'CI', "Côte d'Ivoire", 
                            ifelse(origin_code == 'ST', "São Tomé and Príncipe", origin)),
            origin_continent = ifelse(origin_continent == 'Europe', 'Europa',
                                      ifelse(origin_continent == 'Latin America', 'América Latina', 
                                             ifelse(origin_continent == 'Africa', 'África', 
                                                    ifelse(origin_continent == 'Northern America', 'América del Norte',
                                                           ifelse(origin_continent == '', 'Otros', origin_continent))))))

df_form_origin <- df_form_origin[order(df_form_origin$origin_continent, df_form_origin$origin), ] 

myList <- c()
for (cont in unique(df_form_origin$origin_continent)) {
  temp <- df_form_origin %>%
      filter(origin_continent == cont) %>%
      select(origin_code, origin) %>%
      rename(id = origin_code,
             text = origin)
  tempList <- list(text = cont, children = temp)
  myList <- c(myList, tempList)
}

myJsonOrigin <- toJSON(myList, pretty = T)

# write(myJson, '~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/web/data/origin.json')
write(myJsonOrigin, 'data/jsons/origin.json')

# Destiny
df_form_destiny <- dec2 %>% 
  filter(destiny %in% df_2015$destiny) %>%
  select(destiny_code, destiny) %>%
  distinct() %>%
  arrange(destiny) %>%
  rename(id = destiny_code,
         text = destiny)

myJsonDestiny <- toJSON(df_form_destiny, pretty = T)
write(myJsonDestiny, 'data/jsons/destiny.json')


# Sex
df_form_sex <- dec2 %>% 
  filter(sex %in% df_2015$sex) %>%
  select(sex_code, sex) %>%
  distinct() %>%
  arrange(sex) %>%
  rename(id = sex_code,
         text = sex)

myJsonSex <- toJSON(df_form_sex, pretty = T)
write(myJsonSex, 'data/jsons/sex.json')

# Age
df_form_age <- dec2 %>% 
  filter(age %in% df_2015$age) %>%
  select(age_code, age) %>%
  distinct() %>%
  transform(age = ifelse(age_code == 'Y_LT14', '0Less than 14', age)) %>%
  arrange(age) %>%
  transform(age = ifelse(age_code == 'Y_LT14', 'Less than 14', age)) %>%
  rename(id = age_code,
         text = age)
  

myJsonAge <- toJSON(df_form_age, pretty = T)
write(myJsonAge, 'data/jsons/age.json')



