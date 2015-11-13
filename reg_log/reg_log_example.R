setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/")
options(stringsAsFactors = F)

library(readr)
library(dplyr)


# Load the data
decisions <- read_csv('data/decisions_def.csv', col_names = T, col_types = 'iiiiiiicccccccccccc')

# Subset the UE-28 applications
df <- decisions %>% 
        filter(destiny_europe == 'EU-28') %>%
        dplyr::select(starts_with('x'), decision_fin, destiny_label)

rm(decisions)

# UE: Sum by final decision
df_ue <- aggregate(cbind(x2014, x2013, x2012, x2011, x2010, x2009, x2008) ~ decision_fin, data = df, sum)

df_ue <- melt(df_ue, variable.name = 'year')
df_ue$year <- gsub('x', '', df_ue$year, fixed = T)

df_ue <- dcast(df_ue, year ~ decision_fin)
names(df_ue) <- tolower(names(df_ue))

write.csv(df_ue, 'reg_log/ue_totals.csv', row.names = F)

# DESTINY COUNTRY: Sum by final decision
df_destiny_countries <- aggregate(cbind(x2014, x2013, x2012, x2011, x2010, x2009, x2008) ~ decision_fin + destiny_label, data = df, sum)

df_destiny_countries <- melt(df_destiny_countries, variable.name = 'year')
df_destiny_countries$year <- gsub('x', '', df_destiny_countries$year, fixed = T)

df_destiny_countries <- dcast(df_destiny_countries, year + destiny_label ~ decision_fin)
names(df_destiny_countries) <- tolower(names(df_destiny_countries))

write.csv(df_destiny_countries, 'reg_log/destiny_country.csv', row.names = F)




####################### Load the data
df_ue <- read_csv('reg_log/ue_totals.csv')

df_destiny_countries <- read_csv('reg_log/destiny_country.csv')
# Remove NAs and accepted & rejected == 0
df_destiny_countries <- df_destiny_countries %>%
                  filter(!is.na(rejected)) %>%
                  mutate(sum = rejected + accepted) %>%
                  filter(sum != 0)

df_destiny_countries$sum <- NULL

####################### Add new columns
df <- mutate (df_destiny_countries, 
              total = accepted + rejected,
              prop_accepted = accepted / total)

# Plot
plot(df$year, df$prop_accepted, type="l", ylim = range(0, 1), col=2, ylab="proporción de aceptados",xlab="year")
title("Relación año y aceptación de asilo (UE)",col.main="grey") 

ggplot(data = df, aes(x=year, y=prop_accepted)) + geom_line(aes(group=destiny_label, colour = destiny_label))

# Logit
# Store the year as factor as is a categorical variable
# df$year <- factor(df$year)

# Create the logit

# quitar 2014, rehacer el modelo, y sacar predicción para ese año.
# volver a hacerlo con el año 2014 y comparar real y estimado

logit <- glm(prop_accepted ~ year + destiny_label, weights = total, family='binomial',data=df) 
summary(logit)

# Success probability for every year, equal to prop_accepted( so, proportion of accepted == probability to be accepted)
df$real2014 <- predict(logit, type = "response")

# Predict 2014 to compare to the real value
df_short <- filter(df, year != 2014)

logit2 <- glm(prop_accepted ~ year + destiny_label, weights = total, family='binomial',data=df_short) 
summary(logit2)


df$success_probability= predict(logit, type = "response")


# Predict for year 2014, based on logit 2
x2014 <- subset(df, year == 2014)
x2014$predict2014 <- predict(logit2, newdata = x2014, type = "response") 

plot(x2014$real2014, x2014$predict2014)
abline(a=0, b=1, col= 'red')


x2015$year <- 2014


x2015$predict2015 <- predict(logit, newdata = x2015, type = "response") 
x2015$predict2014 <- predict(logit, newdata = x2015, type = "response") 


df$success_probability= predict(logit, type = "response")



# Preparación de los datos en formato vector de éxitos y fracasos
y <- c(rep(1,sum(df$accepted)) , rep(0,sum(df$rejected)) )
year <- c(rep(df$year,df$accepted),rep(df$year,df$rejected)) 



year<- factor(year)
mylogit <- glm(y ~ year, family = "binomial")



summary(mylogit)
summary(logit)
predict(mylogit, type = "response")
# predict
newDf<- data.frame(year = '8')

  #predicción de valores nuevos
  dosis=7
sexo="h"
ndatos1=data.frame(dosis,sexo)
ndatos1
predict(mylogit, newdata = newDf,type = "response") 
  
head(year)

# Como
  