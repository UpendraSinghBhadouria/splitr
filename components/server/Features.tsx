import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

import { FEATURES } from "@/constants";

export const Features = () => {
  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-green-100 text-green-700">
          Features
        </Badge>
        <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
          Everything you need to split expenses
        </h2>
        <p className="mx-auto mt-3 max-w-175 text-gray-500 md:text-xl/relaxed">
          Our platform provides all the tools you need to handle shared expenses
          with ease.
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, Icon, bg, color, description }) => (
            <Card
              key={title}
              className="flex flex-col items-center space-y-4 p-6 text-center"
            >
              <div className={`rounded-full p-3 ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>

              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-gray-500">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
