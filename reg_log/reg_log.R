setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/")
options(stringsAsFactors = F)

library(readr)
library(dplyr)
library(ggplot2)
library(jsonlite)


# Load the data
# decisions <- read_csv('data/decisions_def.csv', col_names = T, col_types = 'iiiiiiicccccccccccc')

dec2 <- read_csv('data/decisions_v2_decod_esp.csv', col_names = T, col_types = 'cccciiiicccccccccc')


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

unique(df_2015$age)

df_2015 <- df_2015 %>%
    transform(age=ifelse(age == '65 o mÃ¡s', '65 o más', age))

df_2015 <- df_2015 %>%
  transform(origin=ifelse(origin == 'Santa Lucía Lucia', 'Santa Lucía', 
                          ifelse(origin == 'Turquia', 'Turquía',
                                 ifelse(origin == 'Gambia, The', 'Gambia', origin))))

# Write the csv
write.csv(df_2015, 'data/predict2015_esp.csv', row.names = F)

# Write the short version, filtering those values that are not NAs
df_2015_short <- df_2015 %>% filter(!is.na(predict2015))
write.csv(df_2015_short, 'data/predict2015_short_esp.csv', row.names = F)



