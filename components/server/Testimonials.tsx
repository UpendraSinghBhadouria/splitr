import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { TESTIMONIALS } from "@/constants";

export const Testimonials = () => {
  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-green-100 text-green-700">
          Testimonials
        </Badge>
        <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
          What our users are saying
        </h2>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role, image }) => (
            <Card key={name} className="flex flex-col justify-between">
              <CardContent className="space-y-4 p-6">
                <p className="text-gray-500">{quote}</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {/* Placeholder avatar */}
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="uppercase">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
