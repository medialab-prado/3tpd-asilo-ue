setwd("~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/")
options(stringsAsFactors = F)

library(readr)
library(dplyr)


# Load the data
# decisions <- read_csv('data/decisions_def.csv', col_names = T, col_types = 'iiiiiiicccccccccccc')

dec2 <- read_csv('data/decisions_v2_comp_decod.csv', col_names = T, col_types = 'ccccciiicccccccccc')

# ALL
# Subset the UE-28 applications
df <- dec2 %>% 
  filter(destiny_ue == 'EU-28') %>%
  select(year, origin, destiny, sex, age, rejected, accepted)

names(df) <- gsub('_label', '', colnames(df), fixed = T)
df <- aggregate(cbind(x2014, x2013, x2012, x2011, x2010, x2009, x2008) ~ decision_fin + origin + destiny + sex + age, data = df, sum)

df_melt <- melt(df, variable.name = 'year')
df_melt$year <- gsub('x', '', df_melt$year, fixed = T)

df_dcast <- dcast(df_melt, year + origin + destiny + sex + age ~ decision_fin)

names(df_dcast) <- tolower(names(df_dcast))


write.csv(df_dcast, 'reg_log/ue_desaggregated.csv', row.names = F)


# Remove NAs and accepted & rejected == 0
df_logit <- df_dcast %>%
  filter(!is.na(rejected)) %>%
  mutate(sum = rejected + accepted) %>%
  filter(sum != 0)

no_data_rejected <- df_dcast %>%
  filter(is.na(rejected))

no_applications <- df_dcast %>%
  mutate(sum = rejected + accepted) %>%
  filter(sum == 0)
no_applications$sum <- NULL

nrow(df_logit) + nrow(no_data_rejected) + nrow(no_applications) == nrow(df_dcast)

### Get the proportion of applications to each country, given a origin. 
df_per_applications <- data_frame()

for (ori in unique(df_logit$origin)) {
  print(ori)
  temp_ori <- filter(df_logit, origin == ori)
  
  for (y in unique(temp_ori$year)) {
    temp_ori_y <- filter(temp_ori, year == y)
    print(unique(temp_ori_y$sex))
    for (s in unique(temp_ori_y$sex)) {
      temp_ori_y_s <- filter(temp_ori_y, sex == s)
      
      for (edad in unique(temp_ori_y_s$age)) {
        temp_final <- filter(temp_ori_y_s, age == edad)
        
        total <- sum(temp_final$sum)
        temp_final <- mutate(temp_final, per_applications = sum / total)
        df_per_applications <- rbind(df_per_applications, temp_final) 
    
      }
    }
  }
}

nrow(df_logit) == nrow(df_per_applications)



####################### Add new columns
df_per_applications <- mutate (df_per_applications, 
              proportion_accepted = accepted / sum)

df_melt <- melt(df_per_applications)

## Plot relation between percentage of applications and proportion of accepted

for(ori in unique(df_per_applications$origin)) {
  temp_ori <- filter(df_per_applications, origin == ori)
  for (dest in unique(temp_ori$destiny)) {
    temp <- filter(temp_ori, destiny == dest)
    
    
    pdf(file="~/Dropbox/projects/2015_tpd/3tpd-asilo-ue/exploratory_charts/images/prueba2.pdf")
        
    ggplot(data = temp, aes(group = destiny)) +
      geom_line(aes(x = year, y = per_applications, colour = '% applications to that country')) + 
      geom_line(aes(x = year, y = proportion_accepted, colour = '% accepted over all apps received')) +
      guides(fill=guide_legend(title=NULL)) +
      theme(legend.title = element_text(size=4)) + 
      ggtitle(paste(ori, '->', dest)) +
      facet_grid(age ~ sex)
  
    dev.off()
  }
}



# Plot

ggplot(data = df_logit, aes(x=year, y=proportion_accepted)) + geom_line(aes(group=destiny, colour = destiny))

ggplot(data = df_logit, aes(x=year, y=proportion_accepted, group=sex)) +
  geom_line(aes(colour = sex)) +

#   scale_fill_manual(values = c("#00BEC4", "#F8766D")) + 
#   scale_x_discrete(limits=unique(europe_grouped$year)) +
#   scale_y_continuous(name="absolutes") + 
#   ggtitle("Absolutes") +
#   geom_text(data=europe_grouped, aes(x=year, y=value_cum, label=paste(round(value/1000, 1), 'M', sep = '')), size=3) +
#   coord_flip() +
#   theme_bw() + 
#   theme(legend.position="none") + 
  facet_grid( origin ~ destiny)

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
  