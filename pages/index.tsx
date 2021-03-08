import styled, { createGlobalStyle } from "styled-components";
import * as _ from "lodash";

import { useEffect, useState } from "react";
import initialData from "../data";

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Montserrat:400,900|Roboto:400,900');

  body {
    padding: 10px;
    margin: 0;
    font-family: Roboto, sans-serif;
    font-size: 12px;
  }

  h1 {
    font-family: Montserrat;
  }

  @media only screen and (min-width : 1025px) {
    body {
        font-size: 18px;
    }
}

`;

const BASE_ENDPOINT = "https://api.coingecko.com/api/v3";
const BASE_MARKETS = "coins/markets";
const BASE_URL = `${BASE_ENDPOINT}/${BASE_MARKETS}`;

const DEFAULT_CURRENCY = "eur";
const DEFAULT_IDS = initialData.map((i) => i.id);

const Title = styled.h1`
  color: teal;
`;

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`;

const Image = styled.img`
  width: 10px;
  height: 10px;
`;

const Row = styled.tr`
  transition: all 0.1s ease-in-out;
  &:nth-child(even) {
    background-color: whitesmoke;
  }
  &:hover {
    color: white;
    background-color: #519aba;
  }
`;

const Cell = styled.td`
  padding-top: 5px;
  padding-bottom: 5px;
`;

async function loadData(
  ids: string[] = DEFAULT_IDS,
  currency: string = DEFAULT_CURRENCY
) {
  const idsParam = `ids=${ids.join(",")}`;
  const currencyParam = `vs_currency=${currency}`;
  const url = `${BASE_URL}?${currencyParam}&${idsParam}`;
  const res = await fetch(url);
  return await res.json();
}

function formatNumber(number: number) {
  return number > 1
    ? number > 10
      ? number.toFixed(0)
      : number.toFixed(2)
    : number < 0.001
    ? number.toFixed(4)
    : number.toFixed(3);
}
function generateResults(results: any[], collection: any[]) {
  // Mapping data
  const mappedData = collection.map((item) => {
    const resultsItem = results.find((i) => i.id === item.id) || {};
    const difference = Math.round(
      resultsItem.current_price * item.amount - item.investment
    );
    const differencePercentage = (
      ((resultsItem.current_price * item.amount - item.investment) /
        item.investment) *
      100
    ).toFixed(2);

    return {
      ...item,
      ...resultsItem,
      amount: formatNumber(item.amount),
      investment: parseInt(item.investment.toFixed(0)),
      currentPrice: formatNumber(resultsItem.current_price),
      currentValue: Math.round(resultsItem.current_price * item.amount),
      difference,
      differencePercentage
    };
  });

  // Order data
  const orderedData = mappedData.sort(
    (a, b) => b.differencePercentage - a.differencePercentage
  );

  return orderedData;
}

function generateTotals(data: any[]) {
  return {
    investment: _.sumBy(data, "investment"),
    currentValue: _.sumBy(data, "currentValue"),
    difference: _.sumBy(data, "difference")
  };
}

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    investment: 0,
    currentValue: 0,
    difference: 0
  });

  const updateData = () => {
    loadData().then((res) => {
      const results = generateResults(res, initialData);
      setData(results);
      setTotals(generateTotals(results));
    });
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(() => {
      updateData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  console.log(data);
  return (
    <div>
      <GlobalStyles />
      <Title>My investment</Title>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th>Coin</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Investment</th>
            <th>Current</th>
            <th>Profit</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>€{totals.investment}</th>
            <th>€{totals.currentValue}</th>
            <th>€{totals.difference}</th>
            <th></th>
          </tr>
          {data?.map((item) => (
            <Row key={item.id}>
              <Cell>
                <Image src={item.image} />
              </Cell>
              <Cell>
                {item.name} ({item.symbol})
              </Cell>
              <Cell>€{item.currentPrice}</Cell>
              <Cell>{item.amount}</Cell>
              <Cell>€{item.investment}</Cell>
              <Cell>€{item.currentValue}</Cell>
              <Cell>
                <strong>€{item.difference}</strong>
              </Cell>
              <Cell>%{item.differencePercentage}</Cell>
            </Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
